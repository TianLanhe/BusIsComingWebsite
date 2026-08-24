/// <reference types="vite/client" />

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.mjs" {
  export function prepareHomepageStoryAssets(options: {
    zhSourceDirectory: string;
    enSourceDirectory: string;
    outputDirectory?: string;
    repositoryDirectory?: string;
  }): Promise<unknown>;
  export function compareImages(options: Record<string, string>): Promise<Record<string, string | number>>;
}
