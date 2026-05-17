export const useNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  getParent: () => ({ navigate: jest.fn() }),
});
export const useRoute = () => ({ params: {} });
export const NavigationContainer = ({ children }: any) => children;
