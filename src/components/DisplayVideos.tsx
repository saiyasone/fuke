// src/components/FileUpload.tsx
import React from 'react';
import { gql, useQuery } from '@apollo/client';
import VideoPlayer from './VideoPlayer';

const RANDOM_VIDEOS_QUERY = gql`
  query RandomVideos($searchKeyword: String, $deviceId: String, $limit: Int!, $option: OptionType!) {
  randomVideos(searchKeyword: $searchKeyword, deviceId: $deviceId, limit: $limit, option: $option) {
    success
    data {
      id
      chanelId
      platform 
      createdAt
      updatedAt
      action {
        total_view
        total_like
        total_dislike
        total_download
        total_share
        total_comment
      }
      option {
        title
        description
        hashTag
        tag
        video {
          source {
            public_url
            private_url
            preview_url
            download_url
          }
        }
      }
    }
    error {
      message
      code
      details
    }
  }
}
`;

const DisplayVideos: React.FC = () => {
  const { data, loading, error } = useQuery(RANDOM_VIDEOS_QUERY, {
    variables: { 
      "limit": 2,  
      "deviceId": "aaae567467werqakldjfgwo_sert",
      "option": "FOR_YOU",
      
    }, 
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const videos = data?.randomVideos?.data || [];
  console.log({ videos });

  return (
    <div style={{ padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'start', wordBreak: 'break-all', overflow: 'auto', flexWrap: 'wrap', boxShadow:'revert-layer' }}>
        {videos.map((video: any) => {
          return (
            <div key={video.id}>
              <div style={{paddingLeft: 50, flexWrap: 'wrap', width:"100px", fontSize: 18, color: '#616161', fontWeight: 'bold'}}>Title: {video.option?.title}</div>
              <div style={{paddingLeft: 50, flexWrap: 'wrap', width:"100px", fontSize: 14, color: '#333'}}>description: {video.option?.description}</div>
              <div style={{paddingLeft: 50, flexWrap: 'wrap', width:"100px", fontSize: 14, color: '#333'}}>Tag: {video.option?.tag[0]}</div>
              <div style={{paddingLeft: 50, flexWrap: 'wrap', width:"100px", fontSize: 14, color: '#333'}}>HashTag: {video.option?.hashTag[0]}</div>
            <VideoPlayer videoKey={video.option?.video?.source?.preview_url}/>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DisplayVideos;
