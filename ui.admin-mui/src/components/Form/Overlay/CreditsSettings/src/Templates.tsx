export const cssWrapper
= `
`;

export const css
= `
${cssWrapper}

.title {
  font-size: 50px;
  text-transform: uppercase;
}
.game {
  font-size: 80px;
  text-transform: uppercase;
}
.thumbnail {
  padding-top: 50px;
}
`;
export const html
= `
<div class="title">$title</div>
<div class="game">$game</div>
<img class="thumbnail" src="$thumbnail(200x266)" width="200"/>
`;