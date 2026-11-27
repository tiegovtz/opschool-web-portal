import { streamMedia } from '../../utils/streamMedia';

export default defineEventHandler(event => streamMedia(event, 'video'));
