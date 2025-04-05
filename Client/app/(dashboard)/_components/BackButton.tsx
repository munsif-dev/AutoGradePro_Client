"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Home, ChevronLeft } from "lucide-react";

interface BackButtonProps {
  // Optional fallback path if history is empty
  fallbackPath?: string;

  // Option to display destination text (e.g., "Back to Dashboard")
  destination?: string;

  // Variant of the button: "default", "minimal", "text", "outline"
  variant?: "default" | "minimal" | "text" | "outline";

  // Size of the button: "sm", "md", "lg"
  size?: "sm" | "md" | "lg";

  // Custom icon override
  icon?: React.ReactNode;

  // Whether to use the theme color or custom color
  useThemeColor?: boolean;

  // Custom color for the button (overrides theme color)
  color?: string;

  // Additional CSS classes
  className?: string;

  // Force home navigation instead of using history
  goHome?: boolean;

  // Callback after navigation
  onNavigate?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({
  fallbackPath = "/",
  destination,
  variant = "default",
  size = "md",
  icon,
  useThemeColor = true,
  color,
  className = "",
  goHome = false,
  onNavigate,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine parent path for intelligent fallback
  const getParentPath = () => {
    if (!pathname) return "/";

    const pathParts = pathname.split("/").filter(Boolean);
    if (pathParts.length <= 1) return "/";

    // Remove the last segment to get the parent path
    return "/" + pathParts.slice(0, -1).join("/");
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBackClick();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // Get destination text based on path
  const getContextualDestination = () => {
    if (destination) return destination;

    // Try to extract context from the path
    const pathParts = pathname?.split("/").filter(Boolean) || [];

    if (pathParts.length <= 1) return "Home";

    // Convert camelCase or kebab-case to readable format
    const previousSegment = pathParts[pathParts.length - 2]
      .replace(/-/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());

    return previousSegment;
  };

  const handleBackClick = () => {
    // If goHome is true, navigate directly to home
    if (goHome) {
      router.push("/");
    } else {
      try {
        // Try to go back in history
        window.history.length > 1
          ? router.back()
          : router.push(fallbackPath || getParentPath());
      } catch (e) {
        // If any error occurs, fallback to the parent path or provided fallback
        router.push(fallbackPath || getParentPath());
      }
    }

    if (onNavigate) {
      onNavigate();
    }
  };

  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2.5 py-1 gap-1";
      case "lg":
        return "text-base px-5 py-2.5 gap-2.5";
      case "md":
      default:
        return "text-sm px-4 py-2 gap-2";
    }
  };

  // Get icon size based on button size
  const getIconSize = () => {
    switch (size) {
      case "sm":
        return 14;
      case "lg":
        return 20;
      case "md":
      default:
        return 16;
    }
  };

  // Get variant-specific styles
  const getVariantStyles = () => {
    const themeColorClass = useThemeColor
      ? "text-purple-600 hover:text-purple-700"
      : "";
    const customColorStyle = color ? { color, borderColor: color } : {};

    switch (variant) {
      case "minimal":
        return `${themeColorClass} bg-transparent hover:bg-gray-100`;
      case "text":
        return `${themeColorClass} bg-transparent shadow-none hover:underline`;
      case "outline":
        return `${themeColorClass} bg-transparent border border-current hover:bg-gray-50`;
      case "default":
      default:
        return `${
          useThemeColor
            ? "text-purple-600 bg-white hover:bg-gray-50 shadow-sm"
            : "text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
        }`;
    }
  };

  // The icon element to display
  const IconComponent = () => {
    if (icon) return <>{icon}</>;
    if (goHome) return <Home size={getIconSize()} />;
    return <ArrowLeft size={getIconSize()} />;
  };

  // Generate destination text
  const displayText = destination || (variant !== "minimal" ? "Back" : "");
  const contextText = destination ? null : variant === "default" ? (
    <span className="text-gray-500 text-xs ml-1">
      ({getContextualDestination()})
    </span>
  ) : null;

  return (
    <button
      onClick={handleBackClick}
      className={`
        flex items-center rounded-md transition-all ease-in-out duration-200
        ${getSizeStyles()} 
        ${getVariantStyles()}
        ${className}
      `}
      style={color ? { color } : {}}
      aria-label={`Go back${destination ? ` to ${destination}` : ""}`}
      title={`Go back${destination ? ` to ${destination}` : ""} (Esc)`}
    >
      <IconComponent />
      {displayText && <span>{displayText}</span>}
      {contextText}
    </button>
  );
};

export default BackButton;
