/**
 * UI components barrel export
 */

// Core components
export { Button, type ButtonProps } from "./Button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
} from "./Card";

// Page structure
export { PageHeader } from "./PageHeader";
export { SectionHeader } from "./SectionHeader";

// State components
export { LoadingState } from "./LoadingState";
export { EmptyState } from "./EmptyState";
export { ErrorState } from "./ErrorState";
export { SuccessState } from "./SuccessState";

// Quick mode
export { QuickModeHeader } from "./QuickModeHeader";

// Tabs
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
} from "./Tabs";

// Alert
export {
  Alert,
  AlertDescription,
  AlertTitle,
  type AlertProps,
  type AlertDescriptionProps,
  type AlertTitleProps,
} from "./Alert";

// DropdownMenu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  type DropdownMenuProps,
  type DropdownMenuTriggerProps,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
  type DropdownMenuSeparatorProps,
} from "./DropdownMenu";

// Form inputs
export { Input, type InputProps } from "./Input";
export { Textarea, type TextareaProps } from "./Textarea";
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  type SelectProps,
  type SelectTriggerProps,
  type SelectValueProps,
  type SelectContentProps,
  type SelectItemProps,
} from "./Select";

// Progress
export { Progress, type ProgressProps } from "./Progress";
