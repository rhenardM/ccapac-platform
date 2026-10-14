"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Department } from "@/data/departments";
import MemberCard from "./MemberCard";

interface DepartmentAccordionProps {
  departments: Department[];
  defaultValue?: string;
}

export default function DepartmentAccordion({
  departments,
  defaultValue = "direction",
}: DepartmentAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultValue}
      className="space-y-3 sm:space-y-4"
    >
      {departments.map((dept) => (
        <AccordionItem
          key={dept.id}
          value={dept.id}
          className="border-b border-border/40 last:border-0"
        >
          <AccordionTrigger className="py-4 sm:py-5 md:py-6 lg:py-8 cursor-pointer hover:no-underline group">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 text-left flex-1 min-w-0">
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold uppercase tracking-tight text-foreground/80 group-hover:text-primary transition-colors truncate">
                {dept.name}
              </span>
              <span className="px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full bg-muted text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                {dept.members.length}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 sm:pb-8 md:pb-10 lg:pb-12 pt-3 sm:pt-4">
            <div className={dept.gridCols}>
              {dept.members.map((member) => (
                <MemberCard
                  key={`${member.name}-${member.email}`}
                  member={member}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
