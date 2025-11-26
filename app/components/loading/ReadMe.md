# LoadingAnimation Component

## Overview  
This Vue.js component displays a loading animation with bouncing dots and a dynamic waiting message.

## Props  
| Prop Name  | Type    | Default   | Description  |
|------------|--------|-----------|--------------|
| `isLoading` | Boolean | `false`   | Controls the animation state (true = animated dots). |
| `somo`      | String  | `'physics'` | Determines the message language (English or Kiswahili). |

## Behavior  
- If `isLoading` is `true`, dots will bounce using CSS animations.  
- The text message is determined by the `somo` prop:
  - If `somo.toLowerCase() === 'kiswahili '`, it displays `".. Tafadhali subiri .."`.  
  - Otherwise, it displays `".. Please wait .."`.

## Example Usage  
```vue
<LoadingAnimation :isLoading="true" somo="kiswahili " />
