export type RootStackParamList = {
  Home: undefined;
  MyList: undefined;
  Detail: { id: number };
};

/** Routes reachable from the persistent nav. */
export type NavRoute = 'Home' | 'MyList';
