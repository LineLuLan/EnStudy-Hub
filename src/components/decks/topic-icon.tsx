import {
  Blocks,
  Briefcase,
  Clock,
  Film,
  GraduationCap,
  Home,
  Landmark,
  Lightbulb,
  type LucideIcon,
  MapPin,
  TreePine,
  Users,
  Layers,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  blocks: Blocks,
  briefcase: Briefcase,
  clock: Clock,
  film: Film,
  'graduation-cap': GraduationCap,
  home: Home,
  landmark: Landmark,
  lightbulb: Lightbulb,
  'map-pin': MapPin,
  'tree-pine': TreePine,
  users: Users,
};

export function TopicIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = (name && ICON_MAP[name]) || Layers;
  return <Icon className={className} />;
}
