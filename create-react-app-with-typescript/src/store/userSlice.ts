import { createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice({
  name:         'user',
  initialState: { user: null },
  reducers:     {
    setUser: (state: { user: any }, action: { payload: any }) => {
      state.user = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setUser } = userSlice.actions;
export default userSlice.reducer;