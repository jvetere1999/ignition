/**
 * useReducerState Hook
 *
 * Generic hook for managing complex state with useReducer.
 * Provides automatic logging, error handling, and testing utilities.
 *
 * Usage:
 * ```
 * const { state, dispatch, reset } = useReducerState(reducer, initialState);
 * ```
 */

import { useReducer, useCallback, useState } from 'react';

/**
 * Generic action type with standard properties
 */
export interface Action<T = string, P = unknown> {
  type: T;
  payload?: P;
  meta?: {
    timestamp?: number;
    source?: string;
  };
}

/**
 * Reducer function type
 */
export type Reducer<S, A extends Action> = (state: S, action: A) => S;

/**
 * Options for useReducerState
 */
export interface UseReducerStateOptions {
  /** Enable action logging to console */
  debug?: boolean;
  /** Custom logger function */
  logger?: (action: Action, prevState: unknown, nextState: unknown) => void;
  /** Middleware to run before reducer */
  middleware?: (action: Action) => Action | null;
}

/**
 * Result of useReducerState
 */
export interface UseReducerStateResult<S, A extends Action> {
  state: S;
  dispatch: (action: A) => void;
  reset: (newState: S) => void;
  getState: () => S;
  history: A[];
  clearHistory: () => void;
}

/**
 * useReducerState - Enhanced useReducer with logging and utilities
 */
export function useReducerState<S, A extends Action = Action>(
  reducer: Reducer<S, A>,
  initialState: S,
  options: UseReducerStateOptions = {}
): UseReducerStateResult<S, A> {
  const { debug = false, logger, middleware } = options;

  // Create a wrapper reducer that handles reset
  const wrappedReducer = useCallback((state: S, action: A | { type: '__RESET__'; payload: S }): S => {
    if (typeof action === 'object' && 'type' in action && (action as Record<string, unknown>).type === '__RESET__') {
      return (action as { type: '__RESET__'; payload: S }).payload;
    }
    return reducer(state, action as A);
  }, [reducer]);

  // Internal state tracking
  const [state, internalDispatch] = useReducer(wrappedReducer, initialState);
  const [history, setHistory] = useState<A[]>([]);

  // Wrapped dispatch with logging
  const dispatch = useCallback(
    (action: A) => {
      // Apply middleware
      let processedAction = action;
      if (middleware) {
        const result = middleware(action);
        if (result === null) return; // Middleware cancelled action
        processedAction = result as A;
      }

      // Add timestamp if not present
      if (!processedAction.meta?.timestamp) {
        processedAction = {
          ...processedAction,
          meta: {
            ...processedAction.meta,
            timestamp: Date.now(),
          },
        };
      }

      // Log before dispatch
      if (debug || logger) {
        const nextState = wrappedReducer(state, processedAction);

        if (logger) {
          logger(processedAction, state, nextState);
        } else {
          console.log(`[${processedAction.type}]`, {
            action: processedAction,
            prevState: state,
            nextState,
          });
        }
      }

      // Dispatch action
      internalDispatch(processedAction);

      // Track in history
      setHistory((prev) => [...prev, processedAction]);
    },
    [state, wrappedReducer, debug, logger, middleware]
  );

  // Reset state
  const reset = useCallback(
    (newState: S) => {
      if (debug) {
        console.log('[RESET]', { prevState: state, nextState: newState });
      }

      internalDispatch({ type: '__RESET__', payload: newState } as A & { type: '__RESET__'; payload: S });
      setHistory([]);
    },
    [debug, state]
  );

  // Get current state (for immediate access outside render)
  const getState = useCallback(() => state, [state]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    state,
    dispatch,
    reset,
    getState,
    history,
    clearHistory,
  };
}

/**
 * Custom hook factory for creating typed reducer hooks
 *
 * Usage:
 * ```
 * interface FormState {
 *   email: string;
 *   password: string;
 *   errors: Record<string, string>;
 * }
 *
 * type FormAction =
 *   | { type: 'SET_FIELD'; payload: { field: keyof FormState; value: string } }
 *   | { type: 'SET_ERROR'; payload: { field: string; error: string } }
 *   | { type: 'RESET' };
 *
 * const formReducer: Reducer<FormState, FormAction> = (state, action) => {
 *   switch (action.type) {
 *     case 'SET_FIELD':
 *       return { ...state, [action.payload.field]: action.payload.value };
 *     case 'SET_ERROR':
 *       return { ...state, errors: { ...state.errors, [action.payload.field]: action.payload.error } };
 *     case 'RESET':
 *       return initialState;
 *     default:
 *       return state;
 *   }
 * };
 *
 * export function useFormState(initial?: Partial<FormState>) {
 *   return useReducerState(formReducer, { ...initialState, ...initial });
 * }
 * ```
 */
export function createReducerHook<S, A extends Action = Action>(
  reducer: Reducer<S, A>,
  initialState: S,
  options: UseReducerStateOptions = {}
) {
  return function useCustomReducer(overrideInitial?: Partial<S>) {
    const initial = overrideInitial
      ? { ...initialState, ...overrideInitial }
      : initialState;
    return useReducerState(reducer, initial, options);
  };
}

/**
 * Immer-style reducer wrapper for immutable updates
 * (without requiring immer dependency)
 *
 * Usage:
 * ```
 * const { state, dispatch } = useReducerState(
 *   createImmerReducer((draft, action) => {
 *     if (action.type === 'ADD_ITEM') {
 *       draft.items.push(action.payload);
 *     }
 *   }),
 *   initialState
 * );
 * ```
 */
export function createImmerReducer<S, A extends Action = Action>(
  recipe: (draft: S, action: A) => void | S
): Reducer<S, A> {
  return (state: S, action: A): S => {
    const result = recipe(structuredClone(state), action);
    return result === undefined ? structuredClone(state) : (result as S);
  };
}

/**
 * Combine multiple reducers into one
 *
 * Usage:
 * ```
 * const combinedReducer = combineReducers({
 *   auth: authReducer,
 *   theme: themeReducer,
 *   sync: syncReducer,
 * });
 *
 * const { state: { auth, theme, sync }, dispatch } = useReducerState(
 *   combinedReducer,
 *   { auth: initialAuthState, theme: initialThemeState, sync: initialSyncState }
 * );
 * ```
 */
export function combineReducers<
  S extends Record<string, unknown>,
  A extends Action = Action
>(reducers: {
  [K in keyof S]: Reducer<S[K], A>;
}): Reducer<S, A> {
  return (state: S, action: A): S => {
    const newState = {} as S;
    let hasChanged = false;

    for (const key in reducers) {
      const reducer = reducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      newState[key] = nextStateForKey;
      hasChanged = hasChanged || previousStateForKey !== nextStateForKey;
    }

    return hasChanged ? newState : state;
  };
}

/**
 * Async action middleware
 * Handles async operations in reducer dispatch
 *
 * Usage:
 * ```
 * const middleware = createAsyncMiddleware({
 *   fetchData: async (payload) => {
 *     const response = await fetch(`/api/${payload.id}`);
 *     return response.json();
 *   },
 * });
 *
 * const { state, dispatch } = useReducerState(reducer, initialState, { middleware });
 *
 * // Use it
 * dispatch({
 *   type: 'FETCH_DATA',
 *   payload: { id: 123 },
 *   async: 'fetchData', // Reference async handler
 * } as Action);
 * ```
 */
export function createAsyncMiddleware(
  handlers: Record<string, (payload: unknown) => Promise<unknown>>
) {
  return (action: Action) => {
    const asyncKey = (action as Action & { async?: string }).async;
    if (!asyncKey || !handlers[asyncKey]) {
      return action;
    }

    const handler = handlers[asyncKey];
    handler(action.payload)
      .then((result) => {
        console.log(`[${asyncKey}] resolved:`, result);
      })
      .catch((error) => {
        console.error(`[${asyncKey}] rejected:`, error);
      });

    return action;
  };
}

/**
 * Time-travel debugging - replay actions from history
 *
 * Usage:
 * ```
 * const { state, history } = useReducerState(reducer, initialState);
 * const replayedState = replayActions(initialState, reducer, history.slice(0, 5));
 * ```
 */
export function replayActions<S, A extends Action = Action>(
  initialState: S,
  reducer: Reducer<S, A>,
  actions: A[]
): S {
  return actions.reduce((state, action) => reducer(state, action), initialState);
}
