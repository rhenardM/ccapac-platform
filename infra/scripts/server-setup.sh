#!/usr/bin/env bash
# Préparation d'un VPS Hostinger (Ubuntu 24.04) — à exécuter UNE fois, en root.
# À relire avant exécution : vérifier d'abord que la connexion SSH par clé
# fonctionne pour l'utilisateur `deploy`, sinon vous perdrez l'accès.
#
#   DEPLOY_PUBKEY="ssh-ed25519 AAAA... ci@ccapac" bash server-setup.sh
set -euo pipefail
: "${DEPLOY_PUBKEY:?DEPLOY_PUBKEY (clé publique SSH de la CI) requise}"
SSH_PORT="${SSH_PORT:-22}"

apt-get update && apt-get -y upgrade
apt-get install -y ca-certificates curl gnupg ufw fail2ban unattended-upgrades

# --- Docker Engine (dépôt officiel) ---
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
	> /etc/apt/sources.list.d/docker.list
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" },
  "no-new-privileges": true,
  "live-restore": true,
  "userland-proxy": false
}
JSON
systemctl restart docker

# --- Utilisateur de déploiement (clé SSH uniquement) ---
id deploy >/dev/null 2>&1 || useradd -m -s /bin/bash deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "${DEPLOY_PUBKEY}" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
install -d -m 750 -o deploy -g deploy /opt/ccapac

# --- SSH durci ---
cat > /etc/ssh/sshd_config.d/99-ccapac.conf <<CONF
Port ${SSH_PORT}
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
MaxAuthTries 3
AllowUsers deploy $(logname 2>/dev/null || true)
CONF
systemctl reload ssh || systemctl reload sshd

# --- Firewall hôte : seuls SSH, 80 et 443 ---
# Seul le conteneur nginx publie des ports (80/443) : les bases et Redis ne
# sont jamais publiés, donc le contournement d'UFW par Docker ne les expose pas.
ufw default deny incoming
ufw default allow outgoing
ufw limit "${SSH_PORT}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# --- Anti brute-force SSH + mises à jour de sécurité automatiques ---
systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "OK. Activer aussi le pare-feu Hostinger (hPanel → VPS → Pare-feu) : 22, 80, 443."
