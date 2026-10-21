import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentChildren, JSX } from 'preact';
import { cx } from '../util';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'ink';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  /** Keyboard hint shown on pointer devices with a keyboard, e.g. "Enter". */
  kbd?: string;
  class?: string;
  children?: ComponentChildren;
}

function classes({ variant = 'secondary', size = 'md', block, class: extra }: CommonProps): string {
  return cx('btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', extra);
}

function Inner({ icon, iconRight, kbd, children, size }: CommonProps) {
  const iconSize = size === 'lg' ? 22 : 18;
  return (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      <span class="btn__label">{children}</span>
      {iconRight && <Icon name={iconRight} size={iconSize} />}
      {kbd && (
        <kbd class="btn__kbd" aria-hidden="true">
          {kbd}
        </kbd>
      )}
    </>
  );
}

type ButtonProps = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'size' | 'icon'>;

export function Button(props: ButtonProps): JSX.Element {
  const { variant, size, block, icon, iconRight, kbd, class: extra, children, type, ...rest } = props;
  return (
    <button type={(type as 'button' | 'submit' | undefined) ?? 'button'} class={classes({ variant, size, block, class: extra })} {...rest}>
      <Inner icon={icon} iconRight={iconRight} kbd={kbd} size={size}>
        {children}
      </Inner>
    </button>
  );
}

type LinkProps = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'class' | 'size' | 'icon' | 'role'> & { href: string };

export function ButtonLink(props: LinkProps): JSX.Element {
  const { variant, size, block, icon, iconRight, kbd, class: extra, children, ...rest } = props;
  return (
    <a class={classes({ variant, size, block, class: extra })} {...rest}>
      <Inner icon={icon} iconRight={iconRight} kbd={kbd} size={size}>
        {children}
      </Inner>
    </a>
  );
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'icon' | 'label'> {
  icon: IconName;
  label: string;
  size?: number;
}

export function IconButton({ icon, label, size = 20, class: extra, ...rest }: IconButtonProps): JSX.Element {
  return (
    <button type="button" class={cx('icon-btn', extra as string | undefined)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}
