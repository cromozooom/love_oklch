# Color decimals

is normal that all the sliders are accepting decimals?
taking in considerartion all the formats:

- HEX
- RGB
- HSL
- LCH
- OKLCH
- LAB

for all we need decimals?

# Aler out of gamut

should we show the out of gamut warning only for LCH and OKLCH or for all the formats?

# Calculation precision discoverd during e2e tests

# Scenario for out of gamut

Imagine that

1. when loaded this component color-setter has the default value of red and the Gamut sRGB (fine)
2. Click on LCH editor and I can see for Lightness there is no gradient - I was expecting that sRGB has some borders so I can assume that the value 54.30 is available on that slider

now if I

1. set display P3 gamut and move chroma to 110.30 and then Lightness to 57.60 (everything is fine - till I switch back the gamut to sRGB - when I should see the message that the color is out of the gamut)
