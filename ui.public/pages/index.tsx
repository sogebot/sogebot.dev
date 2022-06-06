import { NextPage } from 'next/types';

const Home: NextPage = () => {
  const invisible = {
    display: 'none'
  };
  return (<span style={invisible}/>)
};

export default Home;
