import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

import { Button } from "./ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteModal({
  open,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>

        <DialogHeader>
          <DialogTitle>
            Confirmar exclusão
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600">
          Tem certeza que deseja excluir esta OS?
        </p>

        <DialogFooter>

          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            Excluir
          </Button>

        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}