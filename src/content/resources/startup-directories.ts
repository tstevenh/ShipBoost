import startupDirectoriesData from "./startup-directories.json";

export type StartupDirectoryResourceItem = {
  id: string;
  name: string;
  url: string;
  domain: string;
  dr: number;
  recommended?: boolean;
  searchText: string;
};

export const startupDirectories: StartupDirectoryResourceItem[] =
  startupDirectoriesData as StartupDirectoryResourceItem[];
