import { useImperativeHandle, useRef, type Ref } from 'react';
import { Platform, TVFocusGuideView, View, type FocusGuideMethods, type ViewProps } from 'react-native';

import { FOCUS_GUIDE_PREFIX } from '../focus/webFocus';

export type FocusGuideHandle = {
  /** Make `node` the guide's destination, i.e. where focus lands when it re-enters. */
  remember: (node: View | null) => void;
};

type Props = ViewProps & {
  /** Unique region name; on web it becomes the DOM id the keyboard layer keys its memory on. */
  name: string;
  ref?: Ref<FocusGuideHandle>;
  /**
   * Whether this region redirects focus on TV. Structural regions (screens, the content
   * area) pass false: they exist so web can tell screens apart, and a native autoFocus
   * guide there would decide entry before the rail guides inside it are asked.
   */
  tvGuide?: boolean;
};

/**
 * On TV, an autoFocus guide sends focus back to the last-focused child when the user
 * moves into this region (e.g. pressing down into a rail returns to where they left it).
 * TVFocusGuideView only exists in the tvOS fork's native build; on web the keyboard
 * layer in focus/webFocus.ts reproduces the behaviour using this view's id.
 */
export function FocusGuide({ name, ref, tvGuide = true, ...props }: Props) {
  const guide = useRef<View & FocusGuideMethods>(null);

  // tvOS drops autoFocus memory once a screen is covered by another (e.g. Home under
  // Detail). An explicit destination survives because React still holds the view, and
  // destinations take precedence over autoFocus. Web tracks memory in webFocus instead.
  useImperativeHandle(
    ref,
    () => ({
      remember: (node) => {
        if (Platform.isTV && node) guide.current?.setDestinations([node]);
      },
    }),
    [],
  );

  const id = `${FOCUS_GUIDE_PREFIX}${name}`;
  return Platform.isTV && tvGuide ? (
    <TVFocusGuideView ref={guide} autoFocus id={id} {...props} />
  ) : (
    <View id={id} {...props} />
  );
}
