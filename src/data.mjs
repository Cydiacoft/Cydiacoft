export function dates(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Array.from({length:30}, (_,i) => new Date(+end - (29-i)*86400000).toISOString().slice(0,10));
}

export const query = `query($login:String!,$from:DateTime!,$to:DateTime!){
 user(login:$login){contributionsCollection(from:$from,to:$to){
 commitContributionsByRepository(maxRepositories:100){
  repository{isPrivate}
  contributions(first:100){pageInfo{hasNextPage} nodes{occurredAt commitCount}}
 }
 issueContributionsByRepository(maxRepositories:100){
  repository{isPrivate}
  contributions(first:100){pageInfo{hasNextPage} nodes{occurredAt}}
 }
 pullRequestContributionsByRepository(maxRepositories:100){
  repository{isPrivate}
  contributions(first:100){pageInfo{hasNextPage} nodes{occurredAt}}
 }
 pullRequestReviewContributionsByRepository(maxRepositories:100){
  repository{isPrivate}
  contributions(first:100){pageInfo{hasNextPage} nodes{occurredAt}}
 }
 repositoryContributions(first:100){
  pageInfo{hasNextPage} nodes{occurredAt repository{isPrivate}}
 }
 }}
}`;

export function aggregate(collection, days) {
  if (!collection) throw new Error('Missing contribution collection');
  const counts = new Map(days.map(date => [date,0]));
  function add(node, count=1) {
    if (!node || !Number.isSafeInteger(count) || count<0 || !/^\d{4}-\d{2}-\d{2}T/.test(node.occurredAt)) throw new Error('Invalid contribution');
    const day=node.occurredAt.slice(0,10);
    if(counts.has(day)) counts.set(day,counts.get(day)+count);
  }
  for (const field of ['commitContributionsByRepository','issueContributionsByRepository','pullRequestContributionsByRepository','pullRequestReviewContributionsByRepository']) {
    const groups=collection[field];
    if(!Array.isArray(groups) || groups.length>=100) throw new Error('Incomplete repository contribution groups');
    for(const group of groups) {
      if(group.repository?.isPrivate !== false) continue;
      if(group.contributions?.pageInfo?.hasNextPage !== false || !Array.isArray(group.contributions.nodes)) throw new Error('Incomplete contribution page');
      for(const node of group.contributions.nodes) add(node,field==='commitContributionsByRepository'?node.commitCount:1);
    }
  }
  const repos=collection.repositoryContributions;
  if(repos?.pageInfo?.hasNextPage !== false || !Array.isArray(repos.nodes)) throw new Error('Incomplete repository page');
  for(const node of repos.nodes) if(node.repository?.isPrivate===false) add(node);
  return [...counts].map(([date,count])=>({date,count}));
}

export async function request(url, options={}, fetcher=fetch) {
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const response=await fetcher(url,{...options,signal:AbortSignal.timeout(20000)});
      if(!response.ok) {
        if((response.status===429 || response.status>=500) && attempt<2) { await new Promise(r=>setTimeout(r,500*(attempt+1))); continue; }
        throw new Error('GitHub request failed: HTTP '+response.status);
      }
      const result=await response.json();
      if(result.errors) throw new Error('GitHub GraphQL returned errors');
      return result;
    } catch(error) {
      if(attempt<2 && (error.name==='TimeoutError' || error.name==='TypeError')) continue;
      throw error;
    }
  }
}

export async function collect(config, token, now=new Date(), fetcher=fetch) {
  if(!token) throw new Error('GITHUB_TOKEN is required; existing assets are preserved');
  const days=dates(now);
  const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','User-Agent':'vernal-digital-journal','X-GitHub-Api-Version':'2022-11-28'};
  const result=await request('https://api.github.com/graphql',{method:'POST',headers,body:JSON.stringify({query,variables:{login:config.username,from:days[0]+'T00:00:00Z',to:now.toISOString()}})},fetcher);
  const contributions=aggregate(result.data?.user?.contributionsCollection,days);
  const projects=[];
  for(const project of config.projects) {
    // Public REST request deliberately carries no token.
    const repo=await request('https://api.github.com/repos/'+project.repo,{headers:{Accept:headers.Accept,'User-Agent':headers['User-Agent']}},fetcher);
    if(repo.private !== false || repo.full_name?.toLowerCase()!==project.repo.toLowerCase() || repo.html_url!=='https://github.com/'+repo.full_name) throw new Error('Featured repository is not verified public');
    projects.push({...project,url:repo.html_url,language:repo.language ?? 'Code'});
  }
  return {contributions,projects,asOf:days.at(-1)};
}
