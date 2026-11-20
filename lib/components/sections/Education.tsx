import { education, sections } from "@/lib/data/portfolio";
import Section from "@/lib/components/layout/Section";
import { Timeline, TimelineItem } from "@/lib/components/ui/Timeline";

export default function Education() {
  return (
    <Section id="education" title={sections.education.title} intro={sections.education.intro}>
      <Timeline>
        {education.map((item) => (
          <TimelineItem
            key={`${item.school}-${item.period}`}
            title={item.degree}
            subtitle={item.school}
            meta={item.period}
          >
            {item.note && <p>{item.note}</p>}
          </TimelineItem>
        ))}
      </Timeline>
    </Section>
  );
}