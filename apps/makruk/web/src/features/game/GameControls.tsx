import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Flag, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@chaturanga/ui';

export interface GameControlsProps {
  canBack: boolean;
  canForward: boolean;
  onFirst: () => void;
  onBack: () => void;
  onForward: () => void;
  onLast: () => void;
  onFlip: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onResign?: () => void;
  canResign?: boolean;
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Button variant="outline" size="icon" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="flex-1">
      {children}
    </Button>
  );
}

export function GameControls(props: GameControlsProps) {
  const { t } = useTranslation();
  const icon = 'h-5 w-5';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <IconButton label={t('play.first')} onClick={props.onFirst} disabled={!props.canBack}>
          <ChevronsLeft aria-hidden className={icon} />
        </IconButton>
        <IconButton label={t('play.back')} onClick={props.onBack} disabled={!props.canBack}>
          <ChevronLeft aria-hidden className={icon} />
        </IconButton>
        <IconButton label={t('play.forward')} onClick={props.onForward} disabled={!props.canForward}>
          <ChevronRight aria-hidden className={icon} />
        </IconButton>
        <IconButton label={t('play.last')} onClick={props.onLast} disabled={!props.canForward}>
          <ChevronsRight aria-hidden className={icon} />
        </IconButton>
      </div>
      <div className="flex gap-2">
        <IconButton label={t('play.flip')} onClick={props.onFlip}>
          <ArrowUpDown aria-hidden className={icon} />
        </IconButton>
        {props.onUndo && (
          <IconButton label={t('play.undo')} onClick={props.onUndo} disabled={!props.canUndo}>
            <Undo2 aria-hidden className={icon} />
          </IconButton>
        )}
        {props.onResign && (
          <IconButton label={t('play.resign')} onClick={props.onResign} disabled={!props.canResign}>
            <Flag aria-hidden className={icon} />
          </IconButton>
        )}
      </div>
    </div>
  );
}
