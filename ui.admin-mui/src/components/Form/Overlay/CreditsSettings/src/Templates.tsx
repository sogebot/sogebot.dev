export const cssWrapper
= `
/* Any customized css should be in #wrapped to not affect anything outside
#wrapper {}
*/
`;

export const css
= `
${cssWrapper}

#wrapper .title {
  font-size: 2.5vw;
  text-transform: uppercase;
}
#wrapper .game {
  font-size: 4vw;
  text-transform: uppercase;
}
#wrapper .thumbnail {
  padding-top: 50px;
}
`;
export const html
= `
<div class="title">$title</div>
<div class="game">$game</div>
<img class="thumbnail" src="$thumbnail(200x266)" width="200"/>
`;