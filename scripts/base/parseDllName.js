module.exports = name => {
  const paths = name.split('/');
  
  return {
    dirs: paths.slice(0, paths.length - 1),
    name: paths[paths.length - 1],
  };
};