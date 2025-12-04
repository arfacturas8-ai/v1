/**
 * User Profile Pages
 * Export all user-related profile pages
 */

export { UserProfilePage } from './UserProfilePage';
export { FollowersListPage } from './FollowersListPage';
export { FollowingListPage } from './FollowingListPage';
export { EditProfilePage } from './EditProfilePage.new';

export default {
  UserProfilePage: () => import('./UserProfilePage'),
  FollowersListPage: () => import('./FollowersListPage'),
  FollowingListPage: () => import('./FollowingListPage'),
  EditProfilePage: () => import('./EditProfilePage.new'),
};
