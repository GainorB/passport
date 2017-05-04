fetch('http://swapi.co/api/people/1')
  .then(response => response.json())
  .then(responseJSON => {
    console.log(responseJSON);
  });
