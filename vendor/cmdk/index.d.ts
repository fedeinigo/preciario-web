import * as React from "react";

export interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  filter?: (value: string, search: string) => boolean;
  label?: string;
}

export interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
}

export interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onSelect?: (value: string, event: React.SyntheticEvent) => void;
  disabled?: boolean;
}

export const Command: React.ForwardRefExoticComponent<
  CommandProps & React.RefAttributes<HTMLDivElement>
> & {
  Input: React.ForwardRefExoticComponent<
    CommandInputProps & React.RefAttributes<HTMLInputElement>
  >;
  List: React.ForwardRefExoticComponent<
    CommandListProps & React.RefAttributes<HTMLDivElement>
  >;
  Empty: React.ForwardRefExoticComponent<
    CommandEmptyProps & React.RefAttributes<HTMLDivElement>
  >;
  Group: React.ForwardRefExoticComponent<
    CommandGroupProps & React.RefAttributes<HTMLDivElement>
  >;
  Item: React.ForwardRefExoticComponent<
    CommandItemProps & React.RefAttributes<HTMLDivElement>
  >;
  Separator: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;
};

export const CommandInput: typeof Command["Input"];
export const CommandList: typeof Command["List"];
export const CommandEmpty: typeof Command["Empty"];
export const CommandGroup: typeof Command["Group"];
export const CommandItem: typeof Command["Item"];
export const CommandSeparator: typeof Command["Separator"];
