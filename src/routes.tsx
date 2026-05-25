import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import App from './App'
import LoginPage from '@/pages/common/Login'
import SignupPage from '@/pages/common/Signup'
import IndexRedirect from '@/pages/common/IndexRedirect'
import NotFoundPage from '@/pages/common/NotFound'
import MerchantDashboard from '@/pages/merchant/Dashboard'
import CampaignListPage from '@/pages/merchant/CampaignList'
import CampaignDetailPage from '@/pages/merchant/CampaignDetail'
import InfluencerPerformancePage from '@/pages/merchant/InfluencerPerformance'
import InfluencerDashboard from '@/pages/influencer/Dashboard'
import InfluencerCampaignsPage from '@/pages/influencer/Campaigns'
import ContentGeneratorPage from '@/pages/influencer/ContentGenerator'
import MyLinksPage from '@/pages/influencer/MyLinks'
import InfluencerSelfPerformancePage from '@/pages/influencer/Performance'
import RedirectPage from '@/pages/tracking/Redirect'
import ProductLandingPage from '@/pages/tracking/ProductLanding'

export const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <IndexRedirect /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'r/:code', element: <RedirectPage /> },
      { path: 'p/:productId', element: <ProductLandingPage /> },
      {
        element: <ProtectedRoute allow="merchant" />,
        children: [
          {
            path: 'merchant',
            element: <AppShell />,
            children: [
              { index: true, element: <MerchantDashboard /> },
              { path: 'campaigns', element: <CampaignListPage /> },
              { path: 'campaigns/:id', element: <CampaignDetailPage /> },
              { path: 'influencers', element: <InfluencerPerformancePage /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute allow="influencer" />,
        children: [
          {
            path: 'influencer',
            element: <AppShell />,
            children: [
              { index: true, element: <InfluencerDashboard /> },
              { path: 'campaigns', element: <InfluencerCampaignsPage /> },
              { path: 'content', element: <ContentGeneratorPage /> },
              { path: 'links', element: <MyLinksPage /> },
              { path: 'performance', element: <InfluencerSelfPerformancePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
