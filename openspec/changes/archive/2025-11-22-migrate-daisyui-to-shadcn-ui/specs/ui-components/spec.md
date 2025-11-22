# UI Components Specification

## ADDED Requirements

### Requirement: Component Library Standard
The application SHALL use shadcn/ui as the standard component library for all UI components, built on Radix UI primitives with Tailwind CSS styling.

#### Scenario: Developer adds a new UI component
- **WHEN** a developer needs a new UI component (button, card, dialog, etc.)
- **THEN** they SHALL use shadcn/ui components from `@/components/ui/*`
- **AND** if the component doesn't exist, they SHALL install it via `npx shadcn-ui@latest add <component>`

#### Scenario: Developer customizes a component
- **WHEN** a developer needs to customize a shadcn/ui component
- **THEN** they SHALL modify the component file in `src/components/ui/`
- **AND** the changes SHALL be version controlled as part of the project

### Requirement: Path Alias Configuration
The application SHALL use `@/` as a path alias pointing to the `./src` directory for cleaner imports.

#### Scenario: Developer imports a UI component
- **WHEN** a developer imports a UI component
- **THEN** they SHALL use the path alias format: `import { Button } from "@/components/ui/button"`
- **AND** TypeScript SHALL resolve the import correctly

#### Scenario: Developer imports a utility function
- **WHEN** a developer imports a utility function
- **THEN** they SHALL use the path alias format: `import { cn } from "@/lib/utils"`
- **AND** the import SHALL resolve at both compile time and runtime

### Requirement: Theme System
The application SHALL support light and dark themes using CSS variables and the `dark` class on the document root element.

#### Scenario: User toggles theme
- **WHEN** a user clicks the theme toggle button
- **THEN** the application SHALL switch between light and dark themes
- **AND** the theme preference SHALL be persisted in localStorage
- **AND** the `dark` class SHALL be added or removed from `document.documentElement`

#### Scenario: User returns to application
- **WHEN** a user returns to the application
- **THEN** the application SHALL load their previously selected theme from localStorage
- **AND** apply it immediately on page load

#### Scenario: New user visits application
- **WHEN** a new user visits the application with no stored theme preference
- **THEN** the application SHALL default to light theme
- **AND** respect the user's system preference if available

### Requirement: Button Components
The application SHALL use shadcn/ui Button component for all interactive button elements.

#### Scenario: Developer creates a primary action button
- **WHEN** a developer needs a primary action button
- **THEN** they SHALL use `<Button variant="default">Label</Button>`
- **AND** the button SHALL have the primary theme color

#### Scenario: Developer creates a secondary action button
- **WHEN** a developer needs a secondary action button
- **THEN** they SHALL use `<Button variant="secondary">Label</Button>`
- **AND** the button SHALL have the secondary theme color

#### Scenario: Developer creates an outline button
- **WHEN** a developer needs an outline button
- **THEN** they SHALL use `<Button variant="outline">Label</Button>`
- **AND** the button SHALL have a border with transparent background

#### Scenario: Developer creates a small button
- **WHEN** a developer needs a smaller button
- **THEN** they SHALL use `<Button size="sm">Label</Button>`
- **AND** the button SHALL render with reduced padding and font size

#### Scenario: Developer creates an icon button
- **WHEN** a developer needs an icon-only button
- **THEN** they SHALL use `<Button size="icon"><Icon /></Button>`
- **AND** the button SHALL render as a square with centered icon

### Requirement: Card Components
The application SHALL use shadcn/ui Card component for grouping related content.

#### Scenario: Developer creates a content card
- **WHEN** a developer needs to group related content
- **THEN** they SHALL use the Card component structure:
  ```tsx
  <Card>
    <CardHeader>
      <CardTitle>Title</CardTitle>
      <CardDescription>Description</CardDescription>
    </CardHeader>
    <CardContent>Content</CardContent>
    <CardFooter>Footer</CardFooter>
  </Card>
  ```
- **AND** the card SHALL render with appropriate spacing and styling

#### Scenario: Developer creates a simple card
- **WHEN** a developer needs a simple card without header or footer
- **THEN** they SHALL use `<Card><CardContent>Content</CardContent></Card>`
- **AND** the card SHALL render with just the content area

### Requirement: Icon System
The application SHALL use lucide-react as the standard icon library.

#### Scenario: Developer adds an icon
- **WHEN** a developer needs an icon
- **THEN** they SHALL import it from lucide-react: `import { IconName } from "lucide-react"`
- **AND** use it as a React component: `<IconName className="size-4" />`

#### Scenario: Theme toggle icon
- **WHEN** the theme toggle button is rendered
- **THEN** it SHALL display a Sun icon in light mode
- **AND** display a Moon icon in dark mode

### Requirement: Input Components
The application SHALL use shadcn/ui Input component for all text input fields.

#### Scenario: Developer creates a search input
- **WHEN** a developer needs a search input field
- **THEN** they SHALL use `<Input type="text" placeholder="Search..." />`
- **AND** the input SHALL use theme-aware colors from CSS variables
- **AND** the input SHALL have proper focus states

#### Scenario: Input renders in dark mode
- **WHEN** an Input component is rendered in dark mode
- **THEN** it SHALL use dark theme CSS variables for background and text
- **AND** maintain proper contrast and readability

### Requirement: Badge Components
The application SHALL use shadcn/ui Badge component for labels and tags.

#### Scenario: Developer creates a category badge
- **WHEN** a developer needs to display a category or tag
- **THEN** they SHALL use `<Badge variant="default">Label</Badge>`
- **AND** the badge SHALL use theme-aware colors

#### Scenario: Developer creates variant badges
- **WHEN** a developer needs different badge styles
- **THEN** they SHALL use built-in variants: `default`, `secondary`, `destructive`, `outline`
- **AND** each variant SHALL have appropriate theme-aware colors

### Requirement: Search Component Patterns
Search components SHALL use theme-aware colors and shadcn/ui components for consistency.

#### Scenario: Search dropdown renders
- **WHEN** a search dropdown is displayed
- **THEN** it SHALL use CSS variables for background, border, and text colors
- **AND** NOT use hardcoded color classes like `bg-white` or `text-gray-900`
- **AND** adapt properly to both light and dark themes

#### Scenario: Search results are highlighted
- **WHEN** a user hovers or navigates to a search result
- **THEN** the result SHALL use theme-aware hover colors
- **AND** maintain proper contrast in both themes

#### Scenario: Search input has focus
- **WHEN** a search input receives focus
- **THEN** it SHALL display a theme-aware focus ring
- **AND** the focus indicator SHALL be clearly visible in both themes

### Requirement: Tailwind CSS v4 Compatibility
The application SHALL use Tailwind CSS v4 with shadcn/ui components.

#### Scenario: Developer uses size utilities
- **WHEN** a developer needs to set width and height to the same value
- **THEN** they SHALL use the `size-*` utility class (e.g., `size-4`)
- **AND** NOT use separate `w-*` and `h-*` classes

#### Scenario: Animation configuration
- **WHEN** the application needs CSS animations
- **THEN** it SHALL use `tw-animate-css` package
- **AND** import it in the global CSS: `@import "tw-animate-css"`

### Requirement: Component Styling Consistency
All UI components SHALL follow shadcn/ui's design system and styling patterns.

#### Scenario: Developer styles a component
- **WHEN** a developer needs to add custom styles to a shadcn/ui component
- **THEN** they SHALL use the `className` prop with Tailwind utilities
- **AND** use the `cn()` utility function to merge class names properly

#### Scenario: Developer needs component variants
- **WHEN** a developer needs different visual variants of a component
- **THEN** they SHALL use the component's built-in variant props
- **AND** only create custom variants if built-in options are insufficient

### Requirement: No DaisyUI Dependencies
The application SHALL NOT use DaisyUI or any DaisyUI-specific classes.

#### Scenario: Code review checks for DaisyUI
- **WHEN** code is reviewed or linted
- **THEN** there SHALL be no imports from `daisyui`
- **AND** there SHALL be no DaisyUI-specific class names (e.g., `btn`, `card-body`, `swap-rotate`)
- **AND** there SHALL be no DaisyUI configuration in Tailwind config

### Requirement: TypeScript Support
All UI components SHALL have full TypeScript type definitions.

#### Scenario: Developer uses a component with TypeScript
- **WHEN** a developer uses a shadcn/ui component in TypeScript
- **THEN** the component SHALL provide proper type definitions
- **AND** TypeScript SHALL provide autocomplete for component props
- **AND** TypeScript SHALL catch type errors at compile time

### Requirement: Accessibility Standards
All UI components SHALL meet WCAG 2.1 Level AA accessibility standards.

#### Scenario: Keyboard navigation
- **WHEN** a user navigates using keyboard only
- **THEN** all interactive elements SHALL be focusable
- **AND** focus indicators SHALL be clearly visible
- **AND** focus order SHALL be logical

#### Scenario: Screen reader support
- **WHEN** a user uses a screen reader
- **THEN** all interactive elements SHALL have appropriate ARIA labels
- **AND** component states SHALL be announced properly
- **AND** semantic HTML SHALL be used where appropriate

### Requirement: Dark Mode Support
All UI components SHALL render correctly in both light and dark themes.

#### Scenario: Component renders in light mode
- **WHEN** the application is in light mode
- **THEN** all components SHALL use light theme CSS variables
- **AND** text SHALL have sufficient contrast against backgrounds
- **AND** interactive elements SHALL be clearly visible

#### Scenario: Component renders in dark mode
- **WHEN** the application is in dark mode (documentElement has `dark` class)
- **THEN** all components SHALL use dark theme CSS variables
- **AND** text SHALL have sufficient contrast against backgrounds
- **AND** interactive elements SHALL be clearly visible
