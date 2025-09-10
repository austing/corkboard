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
  theme: {
    primary: {
      bg: string;
      hover: string;
      text: string;
    };
    invisible: {
      bg: string;
      text: string;
    };
    moving: {
      bg: string;
      text: string;
      border: string;
    };
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
  },
  theme: {
    primary: {
      bg: "bg-indigo-600",
      hover: "hover:bg-indigo-700",
      text: "text-indigo-600"
    },
    invisible: {
      bg: "bg-gray-800",
      text: "text-white"
    },
    moving: {
      bg: "bg-amber-100",
      text: "text-amber-900",
      border: "border-amber-400"
    }
  }
};

export default config;