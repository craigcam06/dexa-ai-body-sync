const Index = () => {
  console.log('Index component is rendering!');
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'red', // Changed to red to make it obvious
      color: 'white',
      padding: '20px',
      fontSize: '30px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1>MOBILE APP TEST</h1>
      <p>If you see this, the app is working!</p>
      <div style={{ 
        backgroundColor: 'blue', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '10px',
        marginTop: '20px',
        fontSize: '20px'
      }}>
        SUCCESS - Connection established!
      </div>
    </div>
  );
};

export default Index;
