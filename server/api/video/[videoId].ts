// import { isEmptyObject } from "@tiptap/core";
import { response } from "express";
import apiDocs from "~/utilities/api-docs";
import { currentTopic } from "~/utilities/controlls";

export default defineEventHandler(async (event) => {
  // get refferer header
  // Get the referer header
  const referer = getHeader(event, "referer");

// Check if the referer is valid
if (
    referer &&
    (referer?.toLowerCase().includes("/interactive/form") || referer?.toLowerCase().includes("/video"))
  ) {
    const { videoId } = getRouterParams(event); // Get query parameters
    const auth_token = getCookie(event, "signInAccessToken");

    if (!auth_token) {
      throw createError({
        statusCode: 401,
        message: "No authorization token provided",
      });
    }

    if (!videoId) {
      throw createError({
        statusCode: 400,
        message: "Reference error: No identifier provided",
      });
    }

    const videoUrl = `${apiDocs.videos.getStream}${videoId}`;
    // console.log('video ID && Current Topic: ',videoId,referer.split('/')[6].replaceAll('%20',' '))
    // submit progess
    // await fetch(apiDocs.progress.video,{
    //   method:"POST",
    //   headers:{
    //     'Authorization':`Bearer ${auth_token}`
    //   },
    //   body:JSON.stringify(
    //     {
    //       "video": `${videoId }`,
    //       "topic": `${referer.split('/').pop()}`
    //     }
    //   )
    // }).then(async (response) => {
    //   console.log('Response',await response.json());
    // })
    // .catch((error) => {
    //   console.error('Error:', error);
    // });

    // Forward the request with headers (including the Authorization token)
    return proxyRequest(event, videoUrl, {
      headers: {
        Authorization: `Bearer ${auth_token}`,
      },
    });
  } else {
    //     return createError({ statusCode: 403, message: 'Access denied' });
    sendRedirect(event, "/error/access-denied", 301); // permanent Redirect
  }
});
