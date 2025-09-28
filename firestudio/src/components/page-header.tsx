interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8 text-center space-y-3">
      <h1 className="text-4xl font-bold tracking-tight gradient-text">{title}</h1>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full mx-auto"></div>
    </div>
  );
}
