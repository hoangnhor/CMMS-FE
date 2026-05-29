import { buildWorkOrderPageActions } from "./actions";

export function useWorkOrdersActions(params) {
  return buildWorkOrderPageActions(params);
}
