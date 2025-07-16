body {
  font-family: sans-serif;
  margin: 0; padding: 0;
  display: flex; flex-direction: column; align-items: center;
}

header, footer {
  text-align: center;
  padding: 1rem;
}

#card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  width: 100%; max-width: 1200px;
  padding: 1rem;
}

.card {
  position: relative;
  width: 100%; /* you can fix the ratio if you like */
  box-shadow: 0 2px 6px rgba(0,0,0,.2);
}

.card img {
  width: 100%;
  display: block;
}

.card .info {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,.5);
  color: #fff;
  padding: .5rem;
  font-size: .9rem;
}

