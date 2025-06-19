
"use client";

import type { LucideIcon, LucideProps } from 'lucide-react';
import { 
  Palette, Server, Settings, Smartphone, DollarSign, Briefcase, User, Mail, 
  FileText, BarChart3, CreditCard, Users, ShieldCheck, MapPin, DatabaseZap, FileStack,
  Tag // Added Tag
} from 'lucide-react';

// Add any other icons you use here
export const iconMap: { [key: string]: LucideIcon } = {
  Palette,
  Server,
  Settings,
  Smartphone,
  DollarSign,
  Briefcase,
  User,
  Mail,
  FileText,
  BarChart3,
  CreditCard,
  Users,
  ShieldCheck,
  MapPin,
  DatabaseZap,
  FileStack,
  Tag, // Mapped Tag
  // Default/fallback icon if needed
  // DefaultIcon: Settings, 
};

interface DynamicIconProps extends LucideProps {
  name?: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  if (!name || !iconMap[name]) {
    // Optionally return a default icon or null
    // const FallbackIcon = iconMap['DefaultIcon'] || Settings;
    // return <FallbackIcon {...props} />;
    console.warn(`DynamicIcon: Icon "${name}" not found in iconMap. Rendering null.`);
    return null;
  }
  const IconComponent = iconMap[name];
  return <IconComponent {...props} />;
};

