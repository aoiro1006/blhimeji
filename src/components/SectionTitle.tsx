interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-2 ml-5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
