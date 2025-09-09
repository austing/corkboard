export interface CorkboardConfig {
  panels: {
    admin: {
      title: string;
      path: string;
    };
    content: {
      title: string;
      path: string;
    };
  };
  app: {
    name: string;
    description: string;
  };
}

const config: CorkboardConfig = {
  panels: {
    admin: {
      title: "Admin Panel",
      path: "/admin"
    },
    content: {
      title: "Scraps and Settings",
      path: "/studio"
    }
  },
  app: {
    name: "Corkboard",
    description: "A collaborative content management platform"
  }
};

export default config;