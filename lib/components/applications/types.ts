import type { ComponentType } from "react";

export interface ApplicationView {
  id: string;
  name: string;
  component: ComponentType;
}

export interface ApplicationDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  views: ApplicationView[];
}

export type ApplicationRegistry = Record<
  string,
  ApplicationDefinition
>;
