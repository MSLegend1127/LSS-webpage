client.connect({
    onSuccess: () => {
      console.log('Connected to broker');
      
      // Subscribe to multiple topics
      client.subscribe('topic/one');
      client.subscribe('topic/two');
      client.subscribe('topic/three');
      
      console.log('Subscribed to multiple topics');
    },
    onFailure: (error) => {
      console.error('Failed to connect:', error.errorMessage);
    },
  });
  