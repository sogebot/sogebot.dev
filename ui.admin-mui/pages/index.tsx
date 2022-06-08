import type { ReactElement } from 'react';

import { Layout } from '~/src/components/Layout/main';

import { NextPageWithLayout } from './_app';

const Home: NextPageWithLayout = () => {
  const invisible = { display: 'none' };
  return (<span style={invisible}/>);
};

Home.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export default Home;
