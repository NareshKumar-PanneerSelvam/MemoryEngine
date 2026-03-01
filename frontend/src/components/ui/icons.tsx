import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </BaseIcon>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M7 6l1 14h8l1-14" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </BaseIcon>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m9 18 6-6-6-6" />
    </BaseIcon>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 9 6 6 6-6" />
    </BaseIcon>
  );
}

export function IconPanelLeft(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </BaseIcon>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </BaseIcon>
  );
}

export function IconSave(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </BaseIcon>
  );
}

export function IconFileText(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </BaseIcon>
  );
}

export function IconBold(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h9a4 4 0 0 1 0 8H6z" />
    </BaseIcon>
  );
}

export function IconItalic(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M19 4h-9" />
      <path d="M14 20H5" />
      <path d="M15 4 9 20" />
    </BaseIcon>
  );
}

export function IconCode(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </BaseIcon>
  );
}

export function IconHeading(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 12h8" />
      <path d="M4 6v12" />
      <path d="M12 6v12" />
      <path d="m17 12 3-3v6" />
    </BaseIcon>
  );
}

export function IconList(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </BaseIcon>
  );
}

export function IconListOrdered(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 6h11" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M4 14h2l-2 4h2" />
    </BaseIcon>
  );
}

export function IconQuote(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 7h4v6H7z" />
      <path d="M13 7h4v6h-4z" />
      <path d="M7 13a3 3 0 0 1-3 3" />
      <path d="M13 13a3 3 0 0 1-3 3" />
    </BaseIcon>
  );
}

export function IconLayoutDashboard(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="5" rx="1" />
      <rect x="13" y="10" width="8" height="11" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
    </BaseIcon>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </BaseIcon>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </BaseIcon>
  );
}

export function IconEye(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </BaseIcon>
  );
}
