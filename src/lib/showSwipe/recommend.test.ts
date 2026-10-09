import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchNextBatch } from './recommend';
import { fetchTrending, fetchNowPlaying, fetchDiscover, resolveCard } from './tmdbClient';
vi.mock('./storage',()=>({getSeenIds:()=>[],getGenreScores:()=>({}),getTotalSwipes:()=>0}));
vi.mock('./tmdbClient',()=>({fetchTrending:vi.fn(),fetchNowPlaying:vi.fn(),fetchDiscover:vi.fn(),resolveCard:vi.fn()}));
const sources=[fetchTrending,fetchNowPlaying,fetchDiscover];
beforeEach(()=>vi.resetAllMocks());
describe('trailer loading recovery',()=>{
 it('reports service failure instead of an empty deck when every source fails',async()=>{
  sources.forEach(fn=>vi.mocked(fn).mockRejectedValue(new Error('Unavailable')));
  await expect(fetchNextBatch('tv','recent',new Set())).rejects.toThrow('Could not load trailers');
 });
 it('allows a successful search to have no eligible trailers',async()=>{
  sources.forEach(fn=>vi.mocked(fn).mockResolvedValue({page:1,results:[],total_pages:1,total_results:0}));
  await expect(fetchNextBatch('tv','recent',new Set())).resolves.toEqual([]);
 });
 it('reports a trailer-service outage after discovery succeeds',async()=>{
  const item={id:123,adult:false,backdrop_path:null,genre_ids:[18],original_language:'en',overview:'Example',popularity:1,poster_path:'/example.jpg',vote_average:7,vote_count:100,name:'Example',first_air_date:'2026-01-01'};
  sources.forEach(fn=>vi.mocked(fn).mockResolvedValue({page:1,results:[item],total_pages:1,total_results:1}));
  vi.mocked(resolveCard).mockRejectedValue(new Error('Unavailable'));
  await expect(fetchNextBatch('tv','recent',new Set())).rejects.toThrow('Could not load trailers');
 });
});
