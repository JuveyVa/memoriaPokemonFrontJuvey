describe('Validacion de Ventana Incial', () => {
  it('La prueba deberá de validar que la ventana cuenta con el título de la aplicación así como los textos correspondientes', () => {
    cy.visit('http://localhost:8080/')

    cy.get('img[src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg"]').should('exist')

    cy.contains('h2', '¿Eres el mejor maestro pokemon del mundo?').should('exist')

    cy.contains('h3', 'Memoriza la mayor cantidad de Pokemons y demuestralo!!').should('exist')

    cy.contains('h1', 'Equipo elegido para esta ronda:').should('exist')
  })
  it('La prueba deberá validar que aparezca un conjunto inicial de 6 Pokemons a la vista del usuario', () => {
    cy.visit('http://localhost:8080/')

    cy.get('.button-container img').should('be.visible')

    cy.get('.button-container img').should('have.length', 6)
  })
  it('La prueba deberá validar que exista el botón de jugar', () => {
    cy.visit('http://localhost:8080/')

    cy.get('.start-button').should('exist')
  })
})

describe('Secuencia inicial', () => {
  it('La  prueba  deberá  interceptar  la  llamada  realizada  por  el  botón  "Jugar" y asegurarse que la respuesta regresada sea renderizada en la sección de "secuencia  Máquina"', () => {
      cy.visit('http://localhost:8080/')

      cy.get('.start-button').click()

      cy.intercept('POST', '**/enviarSecuencia').as('enviarSecuencia')

      cy.wait(2000)

      cy.contains("h1", "Secuencia a memorizar:").should("exist");

        const pokemonSequence = []
      cy.wait('@enviarSecuencia').then((interception) => {
          for (const pokemon of interception.response.body.pokemonSequence) {
            const imgSrc = pokemon.imagenUrl;
            pokemonSequence.push(imgSrc);
          }
        })

      const pokemonesMemorizar = []

      cy.contains("h1", "Secuencia a memorizar:")
        .parent()
        .find("img")
        .each(($img) => {
          const imgSrc = $img[0].src;
          pokemonesMemorizar.push(imgSrc);
        });
      
    expect(pokemonSequence).to.deep.equal(pokemonesMemorizar);
  });
  it('La  prueba  deberá  validar  que  la  secuencia  sea  reemplazada  después  de  5 segundos  por  el  Pokemon  Ditto  solo  para  que  el  usuario  recuerde  cuantos Pokemons existían en la secuencia', () => {
    cy.visit('http://localhost:8080/')

    cy.get('.start-button').click()

    cy.intercept('POST', '**/enviarSecuencia').as('enviarSecuencia')

    cy.wait(8000)

    cy.contains("h1", "Secuencia a memorizar:").should("exist");

    cy.contains("h1", "Secuencia a memorizar:")
      .parent()
      .find("img")
      .each(($img) => {
        cy.wrap($img).should(
          "have.attr",
          "src",
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png"
        );
    });
  });  
})

describe('Creación y envío de secuencia', () => {
  it('La prueba debe de validar que al dar click en un Pokemon este sea añadido a la secuencia', () => {
    cy.visit('http://localhost:8080/')

    cy.get('.start-button', { timeout: 20000 }).click()

    cy.wait(8000);

    cy.get('.button-container img').should('be.visible');

    let selectedPokemonSrc;
    cy.get('.button-container img').first().then(($img) => {
      selectedPokemonSrc = $img[0].src;
    }).click();

    cy.intercept('POST', '**/enviarSecuencia').as('enviarSecuencia')

    cy.contains("h1", "Secuencia a enviar:").should("exist");

    cy.contains("h1", "Secuencia a enviar:")
        .parent()
        .find("img")
        .should("have.length", 1)
        .and(($img) => {
          // El pokemon añadido es el mismo que se seleccionó
          expect($img[0].src).to.equal(selectedPokemonSrc);
        });
  })
  
  it('La prueba debe de validar que al dar click en un Pokemon de la secuencia este sea removido', () => {
    cy.visit('http://localhost:8080/')

    cy.get('.start-button', { timeout: 20000 }).click()

    cy.wait(8000);

    cy.get('.button-container img').should('be.visible');

    let selectedPokemonSrc;
    cy.get('.button-container img').first().then(($img) => {
      selectedPokemonSrc = $img[0].src;
    }).click();

    cy.intercept('POST', '**/enviarSecuencia').as('enviarSecuencia')

    cy.wait(3000)

    cy.contains("h1", "Secuencia a enviar:").should("exist");

    // El pokemon añadido es el mismo que se selecciono
    cy.contains("h1", "Secuencia a enviar:")
        .parent()
        .find("img")
        .should(($img) => {
          expect($img[0].src).to.equal(selectedPokemonSrc);
        });
    
    // Arreglo de pokemones antes de removerse
    let pokemonSecuenciaAntes;
    cy.contains("h1", "Secuencia a enviar:")
        .parent()
        .find("img")
        .then(($imgs) => {
          pokemonSecuenciaAntes = Array.from($imgs).map(img => img.src);
        });

    cy.contains("h1", "Secuencia a enviar:")
        .parent()
        .find("img")
        .click();
    
    cy.wait(3000)

    // Aqui el pokemon ya no deberia de estar en el arreglo
    cy.contains("h1", "Secuencia a enviar:")
        .parent()
        .find("img")
        .should("have.length", 0)
        .then(() => {
          cy.wrap(pokemonSecuenciaAntes).should('include', selectedPokemonSrc);
        });
  })
  it('La prueba debe validar que el botón de "Enviar Secuencia" aparezca hasta que la cantidad de Pokemons dentro de la secuencia a memorizar y la secuencia a enviar sean iguales.', () => {
    cy.visit('http://localhost:8080/');

  cy.get('.start-button', { timeout: 20000 }).click();

  cy.wait(8000);

  cy.get('.button-container img').should('be.visible');

  cy.contains("h1", "Secuencia a memorizar:")
    .parent()
    .find("img")
    .then(($pokemons) => {
      const totalMemorizados = $pokemons.length;

      for (let i = 0; i < totalMemorizados; i++) {
        cy.get('.button-container img').first().click();
        cy.wait(500); 
      }

      cy.contains("h1", "Secuencia a enviar:")
        .parent()
        .find("img")
        .should("have.length", totalMemorizados);

      cy.get('.play-button').should('exist');
    });
  })
  it('La prueba debe de validar que la secuencia sea enviada como parámetro en la petición POST que se llama al dar click en el botón “Enviar secuencia”', () => {
    cy.visit("http://localhost:8080/");

    cy.get('.start-button', { timeout: 20000 }).click();

    cy.wait(8000);

    cy.intercept("POST", "/enviarSecuencia").as("envioSecuencia");

    cy.get('.button-container img').should('be.visible');

    cy.contains("h1", "Secuencia a memorizar:")
      .parent()
      .find("img")
      .then(($pokemons) => {
          const totalMemorizados = $pokemons.length;

           for (let i = 0; i < totalMemorizados; i++) {
              cy.get('.button-container img').first().click();
              cy.wait(500);
          }

          cy.contains("h1", "Secuencia a enviar:")
              .parent()
              .find("img")
              .should("have.length", totalMemorizados);

          cy.get('.play-button').should('exist');

          cy.get(".play-button").click();

          cy.wait("@envioSecuencia").then((inter) => {
              expect(inter.request.method).to.eq("POST");
              expect(inter.request.body).to.have.property("idJuego");
              expect(inter.request.body).to.have.property("pokemons");
              expect(inter.request.body.pokemons).to.be.an("array");
              expect(inter.request.body.pokemons.length).to.be.greaterThan(0);
          });
      });
    })
})
describe('Finalización del juego', () => {
  it('La prueba debe de validar que al finalizar el juego aparezca el número de pokemons que el jugador memorizó', () => {
    cy.visit('http://localhost:8080/');
    cy.get('.start-button', { timeout: 20000 }).click();
    cy.wait(8000);
    cy.get('.button-container img').should('be.visible');
  
    // Obtener primero la secuencia a memorizar
    cy.contains("h1", "Secuencia a memorizar:")
      .parent()
      .find("img")
      .then(($pokemons) => {
        const totalMemorizados = $pokemons.length;
        const memorizadosUrls = Array.from($pokemons).map(p => p.src);
        
        for (let i = 0; i < totalMemorizados; i++) {
          cy.get(".button-container .image-button").then(($botones) => {
            const botones = Array.from($botones);
            
            let botonDiferente = null;
            
            for (let j = 0; j < botones.length; j++) {
              const botonUrl = botones[j].querySelector('img').src;

              if (botonUrl !== memorizadosUrls[i]) {
                botonDiferente = botones[j];
                break;
              }
            }
            
            if (botonDiferente) {
              cy.wrap(botonDiferente).click();
            } else {
              cy.wrap(botones[0]).click();
            }
          });
          cy.wait(200);
        }
        
        cy.contains("h1", "Secuencia a enviar:")
          .parent()
          .find("img")
          .should("have.length", totalMemorizados);

        cy.get('.play-button').should('exist');

        cy.get('.play-button').click();

        cy.contains('h1', 'GAME OVER').should('exist');
        
        cy.contains('h2', /^Puntaje: \d+$/);
      });
  });
})