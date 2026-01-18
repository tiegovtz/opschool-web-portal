# Video Interactions Admin - Next.js Migration Package

This package contains all the necessary files to migrate the video interactions management system from Nuxt.js to Next.js.

## 📁 Package Contents

### Core Files
- **Types**: TypeScript interfaces for video interactions (`types/interactive-video.interface.ts`)
- **Storage**: File system storage utilities (`lib/storage/videoInteractionsStorage.ts`)
- **Hooks**: React hooks for managing video state (`lib/hooks/`)
- **API Routes**: Next.js API routes for CRUD operations (`app/api/videos/`)
- **Components**: React components for interactive video player and admin UI (`components/`)
- **Pages**: Admin pages for managing video interactions (`app/(admin)/video-interactions/`)
- **Data**: Example video interaction JSON files (`data/video-interactions/`)

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- An existing Next.js 14+ project (or create a new one)

### Installation Steps

1. **Copy files to your Next.js project**

   Copy all files from this package to your Next.js project, maintaining the directory structure:
   ```
   types/ → your-project/types/
   lib/ → your-project/lib/
   components/ → your-project/components/
   app/ → your-project/app/
   data/ → your-project/data/
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure TypeScript paths**

   Ensure your `tsconfig.json` includes the path alias:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

4. **Configure Tailwind CSS** (if not already configured)

   The package includes Tailwind configuration. If your project already uses Tailwind, merge the configs:
   - `tailwind.config.js` - Add the `primary` color to your theme
   - `postcss.config.js` - Ensure PostCSS is configured
   - `app/globals.css` - Include Tailwind directives

5. **Set up environment variables**

   Create a `.env.local` file in your project root:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://apitie.ekima.africa/v1
   ```
   
   Update this URL to match your video API endpoint.

6. **Ensure data directory exists**

   The storage system will create the `data/video-interactions/` directory automatically, but ensure the `data/` directory exists in your project root.

7. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

8. **Access the admin panel**

   Navigate to:
   - Video list: `http://localhost:3000/video-interactions`
   - Specific video: `http://localhost:3000/video-interactions/[videoId]`

## 📝 API Configuration

### Video API Endpoint

Update the `NEXT_PUBLIC_API_BASE_URL` environment variable to point to your video API. The default is set to `https://apitie.ekima.africa/v1`.

You may also need to update `lib/api/videos.ts` if your API has a different response format or requires authentication headers.

### Storage Location

Video interaction JSON files are stored in `data/video-interactions/` relative to your project root. Each file is named `{videoId}.json`.

## 🎯 Features

### Admin Features
- ✅ List all videos
- ✅ View interactions for a specific video
- ✅ Add new interactions (Quiz or Selection)
- ✅ Edit existing interactions
- ✅ Delete interactions
- ✅ Search videos by title, subject, or level

### Interactive Video Player
- ✅ Play/pause controls
- ✅ Timeline with interaction markers
- ✅ Quiz interactions (multiple choice / true-false)
- ✅ Selection interactions (label matching)
- ✅ Fullscreen support
- ✅ Accessibility features (ARIA labels, keyboard navigation)

## 🔧 Customization

### Styling
- Primary color is set to `#0a7ac8` in `tailwind.config.js`
- Modify colors in the Tailwind config to match your brand

### API Routes
- All API routes are in `app/api/videos/[videoId]/interactions/`
- Routes follow RESTful conventions:
  - `GET /api/videos/[videoId]/interactions` - List interactions
  - `POST /api/videos/[videoId]/interactions` - Create interaction
  - `PUT /api/videos/[videoId]/interactions/[interactionId]` - Update interaction
  - `DELETE /api/videos/[videoId]/interactions/[interactionId]` - Delete interaction

### Storage
- Storage is file-based by default
- To migrate to a database, replace `lib/storage/videoInteractionsStorage.ts` with your database implementation
- The storage functions maintain the same interface, so no other code changes are needed

## 📦 File Structure

```
nextjs-migration-package/
├── app/
│   ├── (admin)/
│   │   └── video-interactions/
│   │       ├── page.tsx                    # Video list page
│   │       └── [videoId]/
│   │           └── page.tsx                # Video interactions management page
│   ├── api/
│   │   └── videos/
│   │       └── [videoId]/
│   │           └── interactions/
│   │               ├── route.ts            # GET, POST
│   │               └── [interactionId]/
│   │                   └── route.ts        # PUT, DELETE
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── admin/
│   │   ├── InteractionsList.tsx
│   │   └── InteractionForm.tsx
│   └── interactive/
│       ├── InteractiveVideo.tsx
│       ├── QuizModal.tsx
│       ├── SelectionModal.tsx
│       └── VideoTimeline.tsx
├── data/
│   └── video-interactions/                 # JSON files (copied from original)
├── lib/
│   ├── api/
│   │   └── videos.ts                      # Video API client
│   ├── hooks/
│   │   ├── useInteractiveVideo.ts
│   │   └── useVideoInteractions.ts
│   └── storage/
│       └── videoInteractionsStorage.ts
├── types/
│   └── interactive-video.interface.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🔐 Security Considerations

1. **File System Access**: The storage system writes to the file system. Ensure proper file permissions and consider using a database in production.

2. **Input Validation**: API routes include basic validation. Add additional validation as needed for your use case.

3. **Authentication**: Add authentication middleware to protect admin routes. Consider using Next.js middleware or a library like NextAuth.js.

4. **CORS**: Configure CORS if your frontend and backend are on different domains.

## 🐛 Troubleshooting

### "Module not found" errors
- Ensure all files are copied to the correct locations
- Check that TypeScript path aliases are configured correctly
- Verify `node_modules` is installed

### API errors
- Check that `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Verify your video API is accessible
- Check browser console for CORS or network errors

### Storage errors
- Ensure the `data/` directory exists and is writable
- Check file permissions on the `data/video-interactions/` directory

### Tailwind styles not applying
- Verify `globals.css` is imported in `app/layout.tsx`
- Check that `tailwind.config.js` includes all content paths
- Ensure PostCSS is configured correctly

## 📚 Next Steps

1. **Add Authentication**: Protect admin routes with authentication
2. **Database Migration**: Consider migrating from file storage to a database
3. **Error Handling**: Add comprehensive error handling and user feedback
4. **Testing**: Add unit and integration tests
5. **Deployment**: Configure for your deployment platform (Vercel, AWS, etc.)

## 📄 License

This migration package is provided as-is. Adapt it to your project's needs.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the code comments in the source files
3. Refer to Next.js documentation: https://nextjs.org/docs

---

**Note**: This is a migration package. The original Nuxt.js files remain unchanged in the source project. All files here are copies converted to Next.js/React.


