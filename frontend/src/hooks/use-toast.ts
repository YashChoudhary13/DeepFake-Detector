// src/hooks/use-toast.ts
import * as React from "react";
import { ToastActionElement, type ToastItem } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ToastAction =
  | {
      type: typeof actionTypes.ADD_TOAST;
      toast: ToastItem;
    }
  | {
      type: typeof actionTypes.UPDATE_TOAST;
      toast: Partial<ToastItem>;
    }
  | {
      type: typeof actionTypes.DISMISS_TOAST;
      toastId?: string;
    }
  | {
      type: typeof actionTypes.REMOVE_TOAST;
      toastId?: string;
    };

function reducer(state: ToastItem[], action: ToastAction) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return [...state, action.toast];
    case actionTypes.UPDATE_TOAST:
      return state.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t));
    case actionTypes.DISMISS_TOAST:
      return state.map((t) => (t.id === action.toastId ? { ...t, open: false } : t));
    case actionTypes.REMOVE_TOAST:
      return state.filter((t) => t.id !== action.toastId);
    default:
      return state;
  }
}

const listeners: Array<(toasts: ToastItem[]) => void> = [];
let memoryState: ToastItem[] = [];

function notify(toasts: ToastItem[]) {
  memoryState = toasts;
  listeners.forEach((listener) => listener(toasts));
}

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action);
  notify(memoryState);

  // Automatic remove after very long (you can tune / remove)
  if (action.type === actionTypes.ADD_TOAST) {
    const id = action.toast.id;
    setTimeout(() => {
      dispatch({ type: actionTypes.REMOVE_TOAST, toastId: id });
    }, TOAST_REMOVE_DELAY);
  }
}

export function useToast() {
  const [state, setState] = React.useState<ToastItem[]>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    toasts: state,
    toast: (props: Omit<ToastItem, "id" | "open">) => {
      const id = genId();

      const toastObj: ToastItem = {
        ...props,
        id,
        open: true,
      };

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: toastObj,
      });

      return {
        id,
        dismiss: () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id }),
      };
    },
  };
}
