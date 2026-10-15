#!/usr/bin/env bash
# Préparation du VPS Hostinger pour CCAPAC — à lancer UNE fois, en root.
# Pensé pour un serveur PARTAGÉ (ex. srv1976360 : Caddy + MOSELINE Pay) :
# idempotent, ne réinstalle pas Docker, fusionne la config Docker existante,
# n'ouvre ni ne ferme aucun port utilisé par les autres applications.
#
#   DEPLOY_PUBKEY="ssh-ed25519 AAAA... ci@ccapac" bash server-setup.sh
#
# Étapes :
#   1. swap (4 Go)            5. dossier /opt/ccapac/production
#   2. paquets (jq, fail2ban) 6. UFW : vérifie 22/80/443 (n'en retire aucun)
#   3. Docker : fusion de daemon.json (garde les pools d'adresses existants)
#   4. utilisateur `deploy`   7. SSH : mot de passe désactivé SI une clé root existe
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "À lancer en root."; exit 1; }
: "${DEPLOY_PUBKEY:?DEPLOY_PUBKEY (clé publique SSH de la CI) requise}"
log() { echo "[setup] $*"; }

# --- 1. Swap : évite qu'un pic mémoire tue un conteneur (RAM 8 Go partagée) ---
if ! swapon --show | grep -q .; then
	log "création d'une swap de 4 Go"
	fallocate -l 4G /swapfile && chmod 600 /swapfile
	mkswap /swapfile >/dev/null && swapon /swapfile
	grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
	sysctl -w vm.swappiness=10 >/dev/null
	echo 'vm.swappiness=10' > /etc/sysctl.d/99-ccapac-swap.conf
else
	log "swap déjà présente"
fi

# --- 2. Paquets ---
apt-get update -qq
apt-get install -y -qq jq fail2ban gettext-base curl ca-certificates >/dev/null
command -v docker >/dev/null || { echo "Docker absent : l'installer d'abord (https://docs.docker.com/engine/install/ubuntu/)."; exit 1; }

# --- 3. Docker : fusion (pas d'écrasement) de daemon.json ---
DAEMON=/etc/docker/daemon.json
[ -f "${DAEMON}" ] || echo '{}' > "${DAEMON}"
cp "${DAEMON}" "${DAEMON}.bak-$(date +%Y%m%d%H%M%S)"
jq '. + {
	"log-driver": "json-file",
	"log-opts": { "max-size": "10m", "max-file": "5" },
	"live-restore": true,
	"no-new-privileges": true
}' "${DAEMON}" > "${DAEMON}.new"
if ! cmp -s "${DAEMON}" "${DAEMON}.new"; then
	mv "${DAEMON}.new" "${DAEMON}"
	RUNNING=$(docker ps -q | wc -l)
	if [ "${RUNNING}" -eq 0 ]; then
		systemctl restart docker && log "Docker redémarré (config fusionnée)"
	else
		log "ATTENTION : ${RUNNING} conteneur(s) actif(s) — redémarrer Docker plus tard (systemctl restart docker)"
	fi
else
	rm -f "${DAEMON}.new"; log "daemon.json déjà à jour"
fi

# --- 4. Utilisateur de déploiement (clé SSH uniquement, pas de sudo) ---
id deploy >/dev/null 2>&1 || useradd -m -s /bin/bash deploy
usermod -aG docker deploy   # NB : le groupe docker équivaut à root sur l'hôte
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
grep -qxF "${DEPLOY_PUBKEY}" /home/deploy/.ssh/authorized_keys 2>/dev/null \
	|| echo "${DEPLOY_PUBKEY}" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
passwd -l deploy >/dev/null 2>&1 || true
log "utilisateur deploy prêt"

# --- 5. Dossiers des environnements ---
install -d -m 750 -o deploy -g deploy /opt/ccapac /opt/ccapac/production
log "dossier /opt/ccapac/production prêt"

# --- 6. UFW : on vérifie, on n'enlève rien (règles MOSELINE conservées) ---
if ufw status | grep -q "Status: active"; then
	for rule in 22/tcp 80/tcp 443/tcp; do
		ufw status | grep -q "^${rule} .*ALLOW" || ufw allow "${rule}" >/dev/null
	done
	ufw limit 22/tcp >/dev/null   # limite les tentatives SSH répétées
	log "UFW actif : 22 (limité), 80, 443 — autres règles inchangées"
else
	log "ATTENTION : UFW inactif — non activé automatiquement, à vérifier"
fi

# --- 7. SSH : désactiver l'authentification par mot de passe, sans se bloquer ---
# Les fichiers sshd_config.d sont lus par ordre alphabétique et la PREMIÈRE
# valeur gagne : 50-cloud-init.conf (PasswordAuthentication yes) l'emporte
# aujourd'hui sur 60-cloudimg-settings.conf. Un fichier 05-* passe avant.
if [ -s /root/.ssh/authorized_keys ]; then
	cat > /etc/ssh/sshd_config.d/05-ccapac-hardening.conf <<'CONF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
MaxAuthTries 3
CONF
	sshd -t && systemctl reload ssh
	log "SSH : mots de passe désactivés (connexion root par clé conservée)"
else
	log "SSH NON modifié : /root/.ssh/authorized_keys est vide."
	log "→ ajouter d'abord votre clé publique pour root, tester, puis relancer ce script."
fi
sshd -T 2>/dev/null | grep -Ei '^(passwordauthentication|permitrootlogin) ' | sed 's/^/[setup] effectif : /'

# --- fail2ban (SSH) ---
systemctl enable --now fail2ban >/dev/null
log "fail2ban actif"

log "terminé. Étapes suivantes :"
log "  1. tester : ssh deploy@<IP>   (depuis la machine qui a la clé CI)"
log "  2. après le 1er déploiement : bash /opt/ccapac/<env>/infra/scripts/caddy-site.sh /opt/ccapac/<env>"
log "  3. planifier le redémarrage en attente (*** System restart required ***)"
