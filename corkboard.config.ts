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
    visible: {
      bg: string;
      text: string;
    };
    invisible: {
      bg: string;
      text: string;
      textColor: string; // Text color class (e.g., text-[#efece6])
    };
    moving: {
      bg: string;
      text: string;
      border: string;
    };
    accent: {
      border: string; // Border class for highlights (e.g., border-indigo-500)
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
    visible: {
      bg: "bg-white",
      text: "text-gray-800"
    },
    invisible: {
      bg: "bg-[#efece6]",
      text: "text-gray-800",
      textColor: "text-[#efece6]"
    },
    moving: {
      bg: "bg-amber-100",
      text: "text-amber-900",
      border: "border-amber-400"
    },
    accent: {
      border: "border-indigo-500"
    }
  }
};

export default config;