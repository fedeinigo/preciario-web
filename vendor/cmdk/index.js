const React = require("react");

const CommandContext = React.createContext(null);

function defaultFilter(value, search) {
  if (!search) return true;
  return value.toLowerCase().includes(search.toLowerCase());
}

const Command = React.forwardRef(function Command({ children, filter, label, className, ...props }, ref) {
  const [search, setSearch] = React.useState("");
  const contextValue = React.useMemo(
    () => ({
      search,
      setSearch,
      filter: filter || defaultFilter,
      label: label || "",
    }),
    [search, filter, label],
  );

  return React.createElement(
    "div",
    {
      ref,
      role: "presentation",
      "data-cmdk-root": "",
      className,
      ...props,
    },
    React.createElement(CommandContext.Provider, { value: contextValue }, children),
  );
});

const CommandInput = React.forwardRef(function CommandInput({ value, onValueChange, ...props }, ref) {
  const context = React.useContext(CommandContext);
  if (!context) throw new Error("Command.Input must be used within Command");
  const { search, setSearch, label } = context;
  const resolvedValue = value !== undefined ? value : search;
  return React.createElement("input", {
    ref,
    type: "text",
    role: "combobox",
    "aria-expanded": true,
    "aria-autocomplete": "list",
    "aria-label": label,
    value: resolvedValue,
    onChange: (event) => {
      if (onValueChange) onValueChange(event.target.value);
      setSearch(event.target.value);
    },
    ...props,
  });
});

const CommandList = React.forwardRef(function CommandList({ children, ...props }, ref) {
  return React.createElement(
    "div",
    {
      ref,
      role: "listbox",
      ...props,
    },
    children,
  );
});

const CommandEmpty = React.forwardRef(function CommandEmpty({ children, ...props }, ref) {
  const context = React.useContext(CommandContext);
  if (!context) throw new Error("Command.Empty must be used within Command");
  const { search } = context;
  if (search.trim() === "") return null;
  return React.createElement(
    "div",
    {
      ref,
      role: "note",
      ...props,
    },
    children,
  );
});

const CommandGroup = React.forwardRef(function CommandGroup({ children, heading, ...props }, ref) {
  return React.createElement(
    "div",
    {
      ref,
      role: "group",
      "aria-label": heading,
      ...props,
    },
    children,
  );
});

const CommandSeparator = React.forwardRef(function CommandSeparator(props, ref) {
  return React.createElement("div", { ref, role: "separator", ...props });
});

const CommandItem = React.forwardRef(function CommandItem({ value, onSelect, disabled, children, ...props }, ref) {
  const context = React.useContext(CommandContext);
  if (!context) throw new Error("Command.Item must be used within Command");
  const { search, filter } = context;
  const isVisible = value ? filter(String(value), search) : true;
  if (!isVisible) return null;

  const handleSelect = (event) => {
    if (disabled) return;
    if (typeof onSelect === "function") {
      onSelect(value, event);
    }
  };

  const role = props.role || "option";

  return React.createElement(
    "div",
    {
      ref,
      role,
      tabIndex: disabled ? -1 : 0,
      "data-disabled": disabled ? "" : undefined,
      onClick: (event) => {
        if (typeof props.onClick === "function") props.onClick(event);
        handleSelect(event);
      },
      onKeyDown: (event) => {
        if (typeof props.onKeyDown === "function") props.onKeyDown(event);
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSelect(event);
        }
      },
      ...props,
    },
    children,
  );
});

Command.displayName = "Command";
Command.Input = CommandInput;
Command.List = CommandList;
Command.Empty = CommandEmpty;
Command.Group = CommandGroup;
Command.Item = CommandItem;
Command.Separator = CommandSeparator;

module.exports = {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
};
