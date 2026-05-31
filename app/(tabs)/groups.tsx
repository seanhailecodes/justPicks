import BrowseGroupsScreen from '../group/browse-groups';

// The Groups tab now lands directly on the My Public / My Private screen
// (rendered embedded so it shows a "+" create action instead of a back arrow).
export default function GroupsTab() {
  return <BrowseGroupsScreen embedded />;
}
