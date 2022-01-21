async function route (fastify) {
  fastify.decorate('current', [])

  fastify.get('/draw', { websocket: true }, (connection, req) => {
    const server = fastify.websocketServer

    connection.socket.send(JSON.stringify({
      type: 'member',
      data: fastify.current.map(i => i.name)
    }))

    connection.socket.on('message', message => {
      message = JSON.parse(message.toString())

      if (message.type === 'join' && message.name) {
        if (fastify.current.length > 8) return
        fastify.current.push({
          ip: req.socket.remoteAddress,
          name: message.name
        })
        req.name = message.name
        server.clients.forEach(client =>
          client.send(JSON.stringify({
            type: 'member',
            data: fastify.current.map(i => i.name)
          }))
        )
      }

      if (message.type === 'start') {
        const cards = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        const randomItem = arr => arr.splice((Math.random() * arr.length) | 0, 1)
        server.clients.forEach(client => {
          client.send(JSON.stringify({
            type: 'draw',
            data: randomItem(cards)
          }))
        })
      }

    })

    connection.socket.on('close', () => {
      if (req.name !== undefined) {
        fastify.current = fastify.current.filter(i =>
          !(i.name === req.name && req.socket.remoteAddress === i.ip)
        )
        server.clients.forEach(client =>
          client.send(JSON.stringify({
            type: 'member',
            data: fastify.current.map(i => i.name)
          }))
        )
      }
    })
  })
}

export default route
