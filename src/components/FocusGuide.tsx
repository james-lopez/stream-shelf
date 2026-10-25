import { Platform, TVFocusGuideView, View, type ViewProps } from 'react-native';

import { FOCUS_GUIDE_PREFIX } from '../focus/webFocus';

type Props = ViewProps & {
  /** Unique region name; on web it becomes the DOM id the keyboard layer keys its memory on. */
  name: string;
};

/**
 * On TV, an autoFocus guide sends focus back to the last-focused child when the user
 * moves into this region (e.g. pressing down into a rail returns to where they left it).
 * TVFocusGuideView only exists in the tvOS fork's native build; on web the keyboard
 * layer in focus/webFocus.ts reproduces the behaviour using this view's id.
 */
export function FocusGuide({ name, ...props }: Props) {
  const id = `${FOCUS_GUIDE_PREFIX}${name}`;
  return Platform.isTV ? <TVFocusGuideView autoFocus id={id} {...props} /> : <View id={id} {...props} />;
}
