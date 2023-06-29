import { createSlice } from '@reduxjs/toolkit';

export interface UserState {
  user: null | { id: string, login: string, display_name: string, profile_image_url: string }
}

const initialState: UserState = {  user: null };

export const userSlice = createSlice({
  name:     'user',
  initialState,
  reducers: {
    setUser: (state: { user: any }, action: { payload: any }) => {
      state.user = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setUser } = userSlice.actions;
export default userSlice.reducer;